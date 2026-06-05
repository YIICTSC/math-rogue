import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Gauge, Scale, Sparkles, Trophy, Zap } from 'lucide-react';
import { CHARACTERS } from '../constants';
import { audioService } from '../services/audioService';
import { GameMode, LanguageMode } from '../types';
import EnemyIllustration from './EnemyIllustration';
import { assetUrl } from '../utils/assetPaths';
import {
  OmegaCardDefinition,
  OmegaEnemyDefinition,
  OmegaHeroDefinition,
  OmegaMaterialDefinition,
  OMEGA_CARDS,
  OMEGA_ENEMIES,
  OMEGA_HEROES,
  OMEGA_MATERIALS,
  getOmegaCard,
  getOmegaMaterial,
} from '../data/omegaBalancerData';
import {
  OmegaPhysicsState,
  createFallingOmegaBody,
  createOmegaPhysicsState,
  calculateOmegaTorque,
  getOmegaSafeDropRange,
  isOmegaPhysicsAtRest,
  simulateOmegaDrop,
  stepOmegaPhysics,
  withRestoredBeam,
} from '../services/omegaBalancerPhysics';
import type { Player } from '../types';
import { getHighSchoolEnemyVariant, type VisualThemeId } from '../data/visualThemes';

type Phase = 'VS' | 'READY' | 'PLAYER_TURN' | 'DROPPING' | 'ENEMY_TURN' | 'RESULT';
type Result = 'WIN' | 'LOSE' | null;

interface OmegaRuntimeCard extends OmegaCardDefinition {
  instanceId: string;
}

interface OmegaRuntimeMaterial extends OmegaMaterialDefinition {
  instanceId: string;
}

interface OmegaStatus {
  gravityTurns: number;
  enemyDoubleTurns: number;
  enemyNextHeavy: boolean;
  playerNextLight: boolean;
  resetTiltPending: boolean;
  enemyDropJitter: boolean;
  fineControlTurns: number;
  frictionUpTurns: number;
  frictionDownTurns: number;
  ignoreFallOnce: boolean;
}

interface OmegaRunState {
  phase: Phase;
  result: Result;
  hero: OmegaHeroDefinition;
  enemy: OmegaEnemyDefinition;
  displayPlayer: {
    id?: string;
    name: string;
    imageData: string;
  };
  physics: OmegaPhysicsState;
  playerMaterials: OmegaRuntimeMaterial[];
  enemyMaterials: OmegaRuntimeMaterial[];
  playerCards: OmegaRuntimeCard[];
  nextPlayerMaterial: OmegaRuntimeMaterial;
  nextEnemyMaterial: OmegaRuntimeMaterial;
  dropX: number;
  activeDropId: string | null;
  activeDropOwner: 'player' | 'enemy' | null;
  turn: number;
  message: string;
  resultReward: string;
  status: OmegaStatus;
}

interface OmegaBalancerZProps {
  onBack: () => void;
  onFinish?: (result: 'WIN' | 'LOSE') => void;
  problemMode: GameMode;
  problemModePool?: string[];
  languageMode?: LanguageMode;
  omegaPlayer?: Pick<Player, 'id' | 'imageData'> & { name?: string };
  visualTheme?: VisualThemeId;
}

const cloneMaterial = (definition: OmegaMaterialDefinition): OmegaRuntimeMaterial => ({
  ...definition,
  instanceId: `${definition.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
});

const cloneCard = (definition: OmegaCardDefinition): OmegaRuntimeCard => ({
  ...definition,
  instanceId: `${definition.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
});

const randomFrom = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const createStarterMaterials = (hero: OmegaHeroDefinition) => hero.starterMaterialIds.map(id => cloneMaterial(getOmegaMaterial(id)));
const createTrialMaterials = () => {
  const pool = [...OMEGA_MATERIALS];
  return Array.from({ length: 6 }, () => cloneMaterial(randomFrom(pool)));
};

const drawRewardMaterial = () => cloneMaterial(randomFrom(OMEGA_MATERIALS.filter(material => material.rewardOnly)));
const drawEnemyMaterial = (enemy: OmegaEnemyDefinition, turn: number) => {
  const pool = turn >= 3 && enemy.materialBias > 0.2
    ? OMEGA_MATERIALS.filter(material => material.mass >= 3.2)
    : OMEGA_MATERIALS.filter(material => !material.rewardOnly || Math.random() < 0.25);
  return cloneMaterial(randomFrom(pool));
};

const getOmegaHeroForCharacterId = (characterId: string | undefined) =>
  OMEGA_HEROES.find(hero => hero.characterId === characterId) || OMEGA_HEROES[0];

const createRun = (
  hero: OmegaHeroDefinition,
  displayPlayer: { id?: string; name: string; imageData: string },
  trialMode: boolean,
  visualTheme: VisualThemeId,
): OmegaRunState => {
  const enemy = randomFrom(OMEGA_ENEMIES);
  const starter = trialMode ? createTrialMaterials() : createStarterMaterials(hero);
  const enemyStarter = trialMode
    ? createTrialMaterials()
    : [cloneMaterial(getOmegaMaterial('tri-basic')), cloneMaterial(getOmegaMaterial('box-basic')), cloneMaterial(getOmegaMaterial('rect-basic'))];
  return {
    phase: 'VS',
    result: null,
    hero,
    enemy,
    displayPlayer,
    physics: createOmegaPhysicsState(),
    playerMaterials: starter,
    enemyMaterials: enemyStarter,
    playerCards: [cloneCard(getOmegaCard(hero.signatureCardId)), cloneCard(randomFrom(OMEGA_CARDS.filter(card => card.rarity === 'COMMON')))],
    nextPlayerMaterial: starter[0],
    nextEnemyMaterial: enemyStarter[0],
    dropX: 180,
    activeDropId: null,
    activeDropOwner: null,
    turn: 1,
    message: visualTheme === 'high-school' ? '高校編ライバルと対戦開始。' : 'ライバルと対戦開始。',
    resultReward: '',
    status: {
      gravityTurns: 0,
      enemyDoubleTurns: 0,
      enemyNextHeavy: false,
      playerNextLight: false,
      resetTiltPending: false,
      enemyDropJitter: false,
      fineControlTurns: 0,
      frictionUpTurns: 0,
      frictionDownTurns: 0,
      ignoreFallOnce: false,
    },
  };
};

const getCharacterImage = (hero: OmegaHeroDefinition) => CHARACTERS.find(character => character.id === hero.characterId)?.imageData || CHARACTERS[0]?.imageData;

const OmegaBalancerZ: React.FC<OmegaBalancerZProps> = ({ onBack, onFinish, omegaPlayer, visualTheme = 'elementary' }) => {
  const [run, setRun] = useState<OmegaRunState | null>(null);
  const runRef = useRef<OmegaRunState | null>(null);
  runRef.current = run;

  const fallbackCharacter = visualTheme === 'high-school'
    ? { id: 'WARRIOR', name: '反逆の高校生', imageData: assetUrl('sprites/high-school/characters/0.png') }
    : { id: 'WARRIOR', name: 'わんぱく小学生', imageData: getCharacterImage(OMEGA_HEROES[0]) };
  const displayPlayer = {
    id: omegaPlayer?.id || fallbackCharacter.id,
    name: omegaPlayer?.name || fallbackCharacter.name,
    imageData: omegaPlayer?.imageData || fallbackCharacter.imageData,
  };
  const selectedHero = getOmegaHeroForCharacterId(displayPlayer.id);
  const characterImage = run?.displayPlayer.imageData || displayPlayer.imageData;
  const safeRange = getOmegaSafeDropRange(!!run && run.status.fineControlTurns > 0);
  const trialMode = !onFinish;

  const startRun = () => {
    audioService.playSound('select');
    const nextRun = createRun(selectedHero, displayPlayer, trialMode, visualTheme);
    setRun(nextRun);
    window.setTimeout(() => setRun(prev => prev?.phase === 'VS' ? { ...prev, phase: 'READY', message: 'READY' } : prev), 1850);
    window.setTimeout(() => setRun(prev => prev?.phase === 'READY' ? { ...prev, phase: 'PLAYER_TURN', message: 'BALANCE START! 落下位置を決めて素材を落とせ。' } : prev), 2650);
  };

  useEffect(() => {
    if (!run || run.phase !== 'DROPPING') return;
    const interval = window.setInterval(() => {
      setRun(prev => {
        if (!prev || prev.phase !== 'DROPPING') return prev;
        let physics = stepOmegaPhysics(prev.physics);
        let status = prev.status;
        if (physics.failSide && status.ignoreFallOnce && prev.activeDropOwner === 'player') {
          const savedBodies = physics.bodies.filter(body => body.instanceId !== physics.fallBodyId);
          physics = {
            ...physics,
            bodies: savedBodies,
            failSide: null,
            fallBodyId: null,
          };
          status = { ...status, ignoreFallOnce: false };
          return {
            ...prev,
            physics,
            status,
            phase: prev.activeDropOwner === 'player' ? 'ENEMY_TURN' : 'PLAYER_TURN',
            activeDropId: null,
            activeDropOwner: null,
            message: '奇跡の受け皿で落下を一度だけ無効化した。',
          };
        }
        if (physics.failSide) {
          const loser = prev.activeDropOwner || physics.failSide;
          const result: Result = loser === 'player' ? 'LOSE' : 'WIN';
          audioService.playSound(result === 'WIN' ? 'victory' : 'wrong');
          return {
            ...prev,
            physics,
            phase: 'RESULT',
            result,
            resultReward: result === 'WIN' ? '勝利報酬: キラカードを獲得' : '敗北報酬: カード強化チャンス',
            message: result === 'WIN' ? '敵ターン中に素材がシーソー外へ落下。勝利！' : '自ターン中に素材がシーソー外へ落下。敗北。',
          };
        }
        if (isOmegaPhysicsAtRest(physics)) {
          const owner = prev.activeDropOwner;
          const nextStatus: OmegaStatus = {
            ...status,
            gravityTurns: Math.max(0, status.gravityTurns - 1),
            fineControlTurns: Math.max(0, status.fineControlTurns - 1),
            frictionUpTurns: Math.max(0, status.frictionUpTurns - 1),
            frictionDownTurns: Math.max(0, status.frictionDownTurns - 1),
          };
          physics = {
            ...physics,
            gravity: nextStatus.gravityTurns > 0 ? 0.92 : 0.62,
            frictionMultiplier: nextStatus.frictionUpTurns > 0 ? 1.45 : nextStatus.frictionDownTurns > 0 ? 0.48 : 1,
          };
          if (owner === 'player') {
            return {
              ...prev,
              physics,
              status: nextStatus,
              phase: 'ENEMY_TURN',
              activeDropId: null,
              activeDropOwner: null,
              message: `${prev.nextPlayerMaterial.name}が着地。敵ターンへ。`,
            };
          }
          const repeatEnemy = prev.status.enemyDoubleTurns > 0;
          return {
            ...prev,
            physics,
            status: { ...nextStatus, enemyDoubleTurns: Math.max(0, prev.status.enemyDoubleTurns - 1) },
            phase: repeatEnemy ? 'ENEMY_TURN' : 'PLAYER_TURN',
            activeDropId: null,
            activeDropOwner: null,
            turn: prev.turn + 1,
            message: repeatEnemy ? '連続指名で敵がもう一度動く。' : 'プレイヤーターン。位置を調整して素材を落とせ。',
          };
        }
        return { ...prev, physics };
      });
    }, 16);
    return () => window.clearInterval(interval);
  }, [run?.phase]);

  const applyCard = (card: OmegaRuntimeCard) => {
    setRun(prev => {
      if (!prev || prev.phase !== 'PLAYER_TURN') return prev;
      audioService.playSound('buff');
      const status = { ...prev.status };
      let physics = prev.physics;
      let message = `${card.name}を使用した。`;
      switch (card.effect) {
        case 'ENEMY_DOUBLE_TURN':
          status.enemyDoubleTurns += 1;
          message = '相手を2回連続ターンにした。相手素材が落ちれば勝機。';
          break;
        case 'GRAVITY_UP':
          status.gravityTurns = 1;
          physics = { ...physics, gravity: 0.92 };
          message = '1ターンだけ重力が強くなった。';
          break;
        case 'ENEMY_NEXT_HEAVY':
          status.enemyNextHeavy = true;
          message = '相手の次の素材が重くなる。';
          break;
        case 'PLAYER_NEXT_LIGHT':
          status.playerNextLight = true;
          message = '自分の次の素材が軽くなる。';
          break;
        case 'RESET_TILT':
          physics = withRestoredBeam(physics, 0.62);
          message = 'シーソーの傾きを少し戻した。';
          break;
        case 'ENEMY_DROP_JITTER':
          status.enemyDropJitter = true;
          message = '相手の落下位置にランダムなズレを仕込んだ。';
          break;
        case 'PLAYER_FINE_CONTROL':
          status.fineControlTurns = 2;
          message = '2ターン、落下位置を細かく調整できる。';
          break;
        case 'FRICTION_UP':
          status.frictionUpTurns = 1;
          physics = { ...physics, frictionMultiplier: 1.45 };
          message = '1ターンだけ摩擦が上がった。';
          break;
        case 'FRICTION_DOWN':
          status.frictionDownTurns = 1;
          physics = { ...physics, frictionMultiplier: 0.48 };
          message = '1ターンだけ素材が滑りやすくなった。';
          break;
        case 'IGNORE_FALL_ONCE':
          status.ignoreFallOnce = true;
          message = '一度だけ落下判定を無効化できる。';
          break;
      }
      return {
        ...prev,
        physics,
        status,
        playerCards: prev.playerCards.filter(candidate => candidate.instanceId !== card.instanceId),
        message,
      };
    });
  };

  const dropPlayerMaterial = () => {
    setRun(prev => {
      if (!prev || prev.phase !== 'PLAYER_TURN') return prev;
      audioService.playSound('attack');
      const material = prev.nextPlayerMaterial;
      const body = createFallingOmegaBody({
        material,
        side: 'player',
        x: prev.dropX,
        massMultiplier: prev.status.playerNextLight ? 0.62 : 1,
        frictionMultiplier: prev.status.frictionUpTurns > 0 ? 1.25 : prev.status.frictionDownTurns > 0 ? 0.55 : 1,
      });
      const remaining = prev.playerMaterials.filter(candidate => candidate.instanceId !== material.instanceId);
      const rewardMaterial = remaining.length === 0 || Math.random() < 0.22 ? [drawRewardMaterial()] : [];
      const nextMaterials = [...remaining, ...rewardMaterial];
      const nextMaterial = nextMaterials[0] || drawRewardMaterial();
      return {
        ...prev,
        phase: 'DROPPING',
        physics: { ...prev.physics, bodies: [...prev.physics.bodies, body] },
        playerMaterials: nextMaterials,
        nextPlayerMaterial: nextMaterial,
        activeDropId: body.instanceId,
        activeDropOwner: 'player',
        status: { ...prev.status, playerNextLight: false },
        message: `${material.name}を落下中。`,
      };
    });
  };

  const chooseEnemyDropX = (current: OmegaRunState, material: OmegaRuntimeMaterial) => {
    const massMultiplier = current.status.enemyNextHeavy ? 1.42 : 1 + current.enemy.materialBias * 0.4;
    const frictionMultiplier = current.enemy.id === 'wax-master' ? 0.82 : 1;
    const jitterPenalty = current.status.enemyDropJitter || current.enemy.id === 'notebook-rival' ? 32 : 0;
    const candidates = Array.from({ length: 13 }, (_, index) => 48 + index * 22);
    const scored = candidates.map(x => {
      const jitter = jitterPenalty ? (Math.random() - 0.5) * jitterPenalty : 0;
      const candidateX = Math.max(36, Math.min(current.physics.width - 36, x + jitter));
      const simulated = simulateOmegaDrop(current.physics, {
        material,
        side: 'enemy',
        x: candidateX,
        massMultiplier,
        frictionMultiplier,
        frames: 220,
      });
      if (simulated.failSide) return { x: candidateX, score: -10000 };
      const torque = calculateOmegaTorque(simulated);
      const ownRisk = simulated.bodies
        .filter(body => body.side === 'enemy')
        .reduce((risk, body) => {
          const edgeDistance = Math.min(
            body.x - (simulated.width / 2 - simulated.beamWidth / 2),
            simulated.width / 2 + simulated.beamWidth / 2 - body.x,
          );
          return risk + Math.max(0, 35 - edgeDistance);
        }, 0);
      const playerPressure = simulated.bodies
        .filter(body => body.side === 'player')
        .reduce((pressure, body) => {
          const edgeDistance = Math.min(
            body.x - (simulated.width / 2 - simulated.beamWidth / 2),
            simulated.width / 2 + simulated.beamWidth / 2 - body.x,
          );
          return pressure + Math.max(0, 46 - edgeDistance);
        }, 0);
      return {
        x: candidateX,
        score: playerPressure * 4.2 + Math.abs(torque) * 1.8 - ownRisk * 5 - Math.abs(simulated.beamAngle) * 0.15,
      };
    });
    scored.sort((a, b) => b.score - a.score);
    const bestCount = current.enemy.dropSkill > 0.65 ? 2 : 4;
    return randomFrom(scored.slice(0, bestCount)).x;
  };

  const enemyDrop = () => {
    setRun(prev => {
      if (!prev || prev.phase !== 'ENEMY_TURN') return prev;
      audioService.playSound('select');
      const material = prev.nextEnemyMaterial;
      const dropX = chooseEnemyDropX(prev, material);
      const body = createFallingOmegaBody({
        material,
        side: 'enemy',
        x: dropX,
        massMultiplier: prev.status.enemyNextHeavy ? 1.42 : 1 + prev.enemy.materialBias * 0.4,
        frictionMultiplier: prev.enemy.id === 'wax-master' ? 0.82 : 1,
      });
      const remaining = prev.enemyMaterials.filter(candidate => candidate.instanceId !== material.instanceId);
      const replenished = remaining.length < 2 ? [...remaining, drawEnemyMaterial(prev.enemy, prev.turn)] : remaining;
      const nextEnemyMaterial = replenished[0] || drawEnemyMaterial(prev.enemy, prev.turn);
      return {
        ...prev,
        phase: 'DROPPING',
        physics: { ...prev.physics, bodies: [...prev.physics.bodies, body] },
        enemyMaterials: replenished,
        nextEnemyMaterial,
        activeDropId: body.instanceId,
        activeDropOwner: 'enemy',
        status: { ...prev.status, enemyNextHeavy: false, enemyDropJitter: false },
        message: `${prev.enemy.name}が${material.name}を落下中。`,
      };
    });
  };

  const continueFromResult = () => {
    if (run?.result && onFinish) {
      onFinish(run.result);
      return;
    }
    onBack();
  };

  const setDropXFromClientX = (clientX: number, target: HTMLDivElement) => {
    if (!run || run.phase !== 'PLAYER_TURN') return;
    const rect = target.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;
    const nextX = Math.max(safeRange.min, Math.min(safeRange.max, relativeX * run.physics.width));
    setRun(prev => prev && prev.phase === 'PLAYER_TURN' ? { ...prev, dropX: nextX } : prev);
  };

  const setDropXFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    setDropXFromClientX(event.clientX, event.currentTarget);
  };

  if (!run) {
    return (
      <div className="h-full w-full overflow-y-auto bg-slate-950 text-white custom-scrollbar">
        <div className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(248,113,113,0.18),transparent_30%)] p-4">
          <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col py-4">
            <div className="mb-5 flex items-center justify-between">
              <button onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
                <ArrowLeft size={18} /> 戻る
              </button>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-100">
                <Scale size={14} /> Physics Prototype
              </div>
            </div>

            <section className="mb-6">
              <h1 className="text-4xl font-black tracking-normal text-white md:text-6xl">オメガバランサーZ</h1>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-300 md:text-base">
                シーソー型の土台へ素材を交互に落とす。ひとつでも素材が外へ落ちた側が敗北。
              </p>
            </section>

            <div className="grid gap-3 md:grid-cols-[minmax(260px,360px)_1fr]">
              <div className={`rounded-lg border border-yellow-300/40 bg-gradient-to-br ${selectedHero.color} p-5 shadow-xl`}>
                <div className="text-xs font-black text-white/80">CURRENT HERO</div>
                <img src={characterImage} alt={displayPlayer.name} className="mx-auto mt-3 h-40 object-contain pixel-art" style={{ imageRendering: 'pixelated' }} />
                <div className="mt-3 text-2xl font-black">{displayPlayer.name}</div>
                <div className="mt-1 text-sm font-black text-yellow-100">{selectedHero.title}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
                <div className="text-sm font-black text-cyan-200">バランススタイル</div>
                <div className="mt-2 text-2xl font-black">{selectedHero.name}</div>
                <div className="mt-3 text-sm leading-7 text-slate-300">{selectedHero.intro}</div>
                <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 text-sm">
                  固有カード: <span className="font-black text-yellow-200">{getOmegaCard(selectedHero.signatureCardId).name}</span>
                </div>
                <div className="mt-3 text-xs leading-5 text-slate-400">
                  {visualTheme === 'high-school'
                    ? 'お試しモードでは高校編の主人公「反逆の高校生」を使用します。'
                    : 'お試しモードでは小学生編の主人公「わんぱく小学生」を使用します。'}
                </div>
              </div>
            </div>

            <button onClick={startRun} className="mt-6 inline-flex w-full max-w-md items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 px-6 py-4 text-xl font-black text-white shadow-xl hover:from-emerald-400 hover:to-cyan-500">
              VSバランスバトル開始 <Zap size={22} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const phaseOverlay = run.phase === 'VS' || run.phase === 'READY';

  return (
    <div className="h-full w-full overflow-hidden bg-slate-950 text-white">
      <div className="flex h-full flex-col bg-[linear-gradient(180deg,#020617,#0f172a_46%,#020617)]">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-cyan-300/20 bg-black/70 px-3 py-2">
          <button onClick={onBack} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs font-bold hover:bg-white/10">
            <ArrowLeft size={16} /> 戻る
          </button>
          <div className="text-center">
            <div className="text-lg font-black tracking-normal text-cyan-100 md:text-2xl">オメガバランサーZ</div>
            <div className="text-[11px] font-black text-yellow-300">TURN {run.turn} / {run.message}</div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-yellow-300/25 bg-yellow-300/10 px-2 py-1 text-xs font-black text-yellow-100">
            <Gauge size={15} /> {run.physics.gravity.toFixed(2)}G
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-[132px_minmax(0,520px)] grid-rows-[auto_minmax(0,1fr)] justify-center gap-2 p-2 md:grid-cols-[minmax(150px,240px)_minmax(300px,520px)_minmax(150px,240px)] md:grid-rows-1">
          <FighterPanel className="row-span-2 md:row-span-1" side="player" hero={run.hero} displayName={run.displayPlayer.name} image={characterImage} nextMaterial={run.nextPlayerMaterial} cards={run.playerCards} onUseCard={applyCard} disabled={run.phase !== 'PLAYER_TURN'} />

          <EnemyPanel className="col-start-2 row-start-1 md:col-start-3 md:row-start-1" enemy={run.enemy} nextMaterial={run.nextEnemyMaterial} visualTheme={visualTheme} />

          <section className="relative col-start-2 row-start-2 mx-auto flex h-full w-full max-w-[520px] flex-col items-center overflow-hidden rounded-lg border-4 border-cyan-300/25 bg-slate-900 shadow-[0_0_40px_rgba(34,211,238,0.16)] md:col-start-2 md:row-start-1">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="relative mt-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-black text-cyan-100">VERTICAL BALANCE ARENA</div>

            <div
              className="relative mt-2 aspect-[9/16] w-full max-w-[360px] touch-none overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-slate-800 to-slate-950"
              onPointerDown={setDropXFromPointer}
              onPointerMove={(event) => {
                if (event.buttons === 1) setDropXFromPointer(event);
              }}
              onClick={(event) => setDropXFromClientX(event.clientX, event.currentTarget)}
              onMouseDown={(event) => setDropXFromClientX(event.clientX, event.currentTarget)}
              onTouchStart={(event) => {
                const touch = event.touches[0];
                if (touch) setDropXFromClientX(touch.clientX, event.currentTarget);
              }}
            >
              <div className="absolute left-0 right-0 top-0 h-20 bg-gradient-to-b from-cyan-400/15 to-transparent" />
              <div className="absolute left-1/2 top-3 h-10 w-px -translate-x-1/2 bg-cyan-200/40" />
              {run.phase === 'PLAYER_TURN' && (
                <div className="absolute top-[4%] z-20 flex -translate-x-1/2 flex-col items-center" style={{ left: `${(run.dropX / run.physics.width) * 100}%` }}>
                  <div className="h-10 w-1 rounded-full bg-yellow-300" />
                  <div className="rounded border border-yellow-200 bg-yellow-400 px-2 py-0.5 text-[10px] font-black text-slate-950">DROP</div>
                </div>
              )}

              <div
                className="absolute left-1/2 h-[5%] -translate-x-1/2 rounded-md border border-emerald-100/40 bg-gradient-to-b from-slate-500 to-slate-900 shadow-2xl transition-transform"
                style={{
                  top: `${(run.physics.beamY / run.physics.height) * 100}%`,
                  width: `${(run.physics.beamWidth / run.physics.width) * 100}%`,
                  transform: `translateX(-50%) rotate(${run.physics.beamAngle}deg)`,
                  transformOrigin: '50% 50%',
                }}
              />
              <div
                className="absolute left-1/2 aspect-square w-[26%] -translate-x-1/2 rotate-45 rounded-lg border border-yellow-300/30 bg-yellow-500/20"
                style={{ top: `${((run.physics.beamY + 18) / run.physics.height) * 100}%` }}
              />

              {run.physics.bodies.map(body => (
                <MaterialBody key={body.instanceId} body={body} />
              ))}

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/45 px-3 py-2 text-[11px] font-black">
                <span>傾き {run.physics.beamAngle.toFixed(1)}°</span>
                <span>摩擦 x{run.physics.frictionMultiplier.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid w-full grid-cols-[44px_1fr_44px] gap-2 p-2">
              <button disabled={run.phase !== 'PLAYER_TURN'} onClick={() => setRun(prev => prev ? { ...prev, dropX: Math.max(safeRange.min, prev.dropX - (prev.status.fineControlTurns > 0 ? 8 : 18)) } : prev)} className="rounded-lg border border-white/10 bg-white/10 py-3 font-black disabled:opacity-30">
                <ChevronLeft className="mx-auto" />
              </button>
              <button disabled={run.phase !== 'PLAYER_TURN'} onClick={dropPlayerMaterial} className="rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 py-3 font-black text-slate-950 disabled:opacity-40">
                素材を落とす
              </button>
              <button disabled={run.phase !== 'PLAYER_TURN'} onClick={() => setRun(prev => prev ? { ...prev, dropX: Math.min(safeRange.max, prev.dropX + (prev.status.fineControlTurns > 0 ? 8 : 18)) } : prev)} className="rounded-lg border border-white/10 bg-white/10 py-3 font-black disabled:opacity-30">
                <ChevronRight className="mx-auto" />
              </button>
            </div>
            {run.phase === 'ENEMY_TURN' && (
              <button onClick={enemyDrop} className="mb-2 rounded-lg bg-rose-600 px-5 py-3 font-black shadow-lg shadow-rose-950/40 hover:bg-rose-500">
                敵ターン実行
              </button>
            )}

            {phaseOverlay && <StartOverlay phase={run.phase} />}
            {run.phase === 'RESULT' && <ResultOverlay run={run} onContinue={continueFromResult} onFinish={onFinish} />}
          </section>
        </main>
      </div>
    </div>
  );
};

const FighterPanel: React.FC<{
  side: 'player';
  className?: string;
  hero: OmegaHeroDefinition;
  displayName: string;
  image?: string;
  nextMaterial: OmegaRuntimeMaterial;
  cards: OmegaRuntimeCard[];
  disabled: boolean;
  onUseCard: (card: OmegaRuntimeCard) => void;
}> = ({ className = '', hero, displayName, image, nextMaterial, cards, disabled, onUseCard }) => (
  <aside className={`flex min-h-0 flex-col gap-2 overflow-hidden rounded-lg border border-emerald-300/20 bg-slate-900/70 p-2 ${className}`}>
    <div className={`min-h-40 rounded-lg bg-gradient-to-br ${hero.color} p-2`}>
      <div className="text-xs font-black text-white/80">PLAYER</div>
      <img src={image} alt={displayName} className="mx-auto h-28 object-contain pixel-art" style={{ imageRendering: 'pixelated' }} />
      <div className="truncate text-center text-sm font-black">{displayName}</div>
    </div>
    <MaterialPreview title="次に落とす素材" material={nextMaterial} />
    <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
      <div className="mb-1 text-xs font-black text-yellow-200">特殊カード</div>
      <div className="grid gap-2">
        {cards.map(card => (
          <button key={card.instanceId} disabled={disabled} onClick={() => onUseCard(card)} className={`rounded-lg border border-white/10 bg-gradient-to-br ${card.color} p-2 text-left shadow-lg disabled:grayscale disabled:opacity-60`}>
            <div className="text-[10px] font-black text-white/75">{card.rarity}</div>
            <div className="text-sm font-black">{card.name}</div>
            <div className="mt-1 text-[11px] leading-4 text-white/85">{card.description}</div>
          </button>
        ))}
      </div>
    </div>
  </aside>
);

const EnemyPanel: React.FC<{ className?: string; enemy: OmegaEnemyDefinition; nextMaterial: OmegaRuntimeMaterial; visualTheme: VisualThemeId }> = ({ className = '', enemy, nextMaterial, visualTheme }) => {
  const displayEnemy = visualTheme === 'high-school'
    ? getHighSchoolEnemyVariant({ name: enemy.name, enemyType: 'GENERIC', phase: undefined })
    : { name: enemy.name };
  return (
  <aside className={`flex min-h-0 flex-col gap-2 overflow-hidden rounded-lg border border-rose-300/20 bg-slate-900/70 p-2 ${className}`}>
    <div className={`flex min-h-[82px] items-center gap-2 rounded-lg bg-gradient-to-br ${enemy.color} p-2 md:block md:min-h-40`}>
      <div className="min-w-0 flex-1 md:block">
        <div className="text-xs font-black text-white/80">RIVAL</div>
        <EnemyIllustration name={enemy.name} seed={enemy.id} className="h-14 w-14 md:mx-auto md:h-28 md:w-28" size={18} visualTheme={visualTheme} enemyType="GENERIC" />
        <div className="truncate text-xs font-black md:text-center md:text-sm">{displayEnemy.name}</div>
      </div>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/20 text-2xl font-black md:hidden" style={{ background: nextMaterial.color }} title={nextMaterial.name}>
        {nextMaterial.label}
      </div>
    </div>
    <div className="hidden md:block">
      <MaterialPreview title="次に落とす素材" material={nextMaterial} />
    </div>
    <div className="hidden rounded-lg border border-rose-300/20 bg-rose-950/30 p-3 md:block">
      <div className="text-xs font-black text-rose-200">敵独自のマップ効果</div>
      <div className="mt-1 text-sm font-black">{enemy.mapEffectName}</div>
      <div className="mt-1 text-xs leading-5 text-rose-100/80">{enemy.mapEffectDescription}</div>
    </div>
  </aside>
  );
};

const MaterialPreview: React.FC<{ title: string; material: OmegaRuntimeMaterial }> = ({ title, material }) => (
  <div className="rounded-lg border border-white/10 bg-black/35 p-3">
    <div className="text-xs font-black text-cyan-200">{title}</div>
    <div className="mt-2 flex items-center gap-2">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/20 text-2xl font-black" style={{ background: material.color }}>
        {material.label}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-black">{material.name}</div>
        <div className="text-[11px] font-bold text-slate-300">重さ {material.mass} / 摩擦 {material.friction}</div>
      </div>
    </div>
  </div>
);

const MaterialBody: React.FC<{ body: import('../services/omegaBalancerPhysics').OmegaPhysicsMaterial }> = ({ body }) => {
  const material = body.definition;
  return (
    <div
      className="absolute flex items-center justify-center border border-white/30 text-sm font-black text-white shadow-lg"
      style={{
        left: `${((body.x - material.width / 2) / 360) * 100}%`,
        top: `${((body.y - material.height / 2) / 640) * 100}%`,
        width: `${(material.width / 360) * 100}%`,
        height: `${(material.height / 640) * 100}%`,
        background: material.color,
        borderRadius: material.shape === 'circle' || material.shape === 'relic' ? '999px' : material.shape === 'triangle' ? '12px 12px 4px 4px' : '8px',
        clipPath: material.shape === 'triangle' ? 'polygon(50% 0, 100% 100%, 0 100%)' : material.shape === 'hex' ? 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)' : undefined,
        transform: `rotate(${body.angle}deg)`,
      }}
      title={material.name}
    >
      {material.shape === 'hero' || material.shape === 'enemy' ? <span className="text-xs">{material.name.slice(0, 2)}</span> : material.label}
    </div>
  );
};

const StartOverlay: React.FC<{ phase: Phase }> = ({ phase }) => (
  <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/72 backdrop-blur-sm">
    <div className="text-center">
      {phase === 'VS' && <div className="text-7xl font-black text-red-500 drop-shadow-[0_0_18px_rgba(239,68,68,0.9)]">VS</div>}
      {phase === 'READY' && (
        <>
          <div className="text-6xl font-black text-yellow-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.9)]">READY</div>
          <div className="mt-3 text-3xl font-black text-cyan-200">BALANCE START</div>
        </>
      )}
    </div>
  </div>
);

const ResultOverlay: React.FC<{ run: OmegaRunState; onContinue: () => void; onFinish?: (result: 'WIN' | 'LOSE') => void }> = ({ run, onContinue, onFinish }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <div className={`mx-4 w-full max-w-md rounded-lg border-4 p-6 text-center shadow-2xl ${run.result === 'WIN' ? 'border-yellow-300 bg-yellow-950/80' : 'border-rose-400 bg-rose-950/80'}`}>
      <Trophy className="mx-auto mb-3 text-yellow-300" size={56} />
      <div className="text-5xl font-black">{run.result === 'WIN' ? 'WIN' : 'LOSE'}</div>
      <div className="mt-3 text-lg font-black">{run.message}</div>
      <div className="mt-3 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm font-black text-cyan-100">{run.resultReward}</div>
      <div className="mt-5">
        <button onClick={onContinue} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 font-black hover:bg-cyan-500">
          <Sparkles size={18} /> {onFinish ? '報酬へ' : '続ける'}
        </button>
      </div>
    </div>
  </div>
);

export default OmegaBalancerZ;
