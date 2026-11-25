import { assetUrl } from '../utils/assetPaths';
import type { ShowMode, ShowView } from './types';

type HostPose = 'welcome' | 'question' | 'thinking' | 'reveal' | 'celebrate' | 'mystery';
const modeProps: Record<ShowMode, string> = {
  STANDARD: 'trophy', BUZZER: 'buzzer', SURVIVAL: 'trophy', TEAMS: 'party', CONSENSUS: 'party',
  MAJORITY: 'party', NEAREST: 'target', DRAW: 'paint', VOTE: 'target', WOLF: 'mask',
};

export function StudioSet() {
  return <img className="qs-studio-set" src={assetUrl('sprites/quiz-show/studio.webp')} alt="" aria-hidden="true" />;
}

export function StudioHost({ pose }: { pose: HostPose }) {
  return <img key={pose} className="qs-studio-host" data-host-pose={pose} src={assetUrl(`sprites/quiz-show/host-${pose}.webp`)} alt="" aria-hidden="true" />;
}

export function ModeProp({ mode }: { mode: ShowMode }) {
  return <img className="qs-mode-prop" src={assetUrl(`sprites/quiz-show/prop-${modeProps[mode]}.webp`)} alt="" aria-hidden="true" />;
}

export function roundPose({ phase, round }: ShowView): HostPose {
  if (phase === 'ready') return 'welcome';
  if (phase === 'open') return 'question';
  if (phase === 'closed' || phase === 'voting') return 'thinking';
  if (round?.showJudgments && round.tiles.some(tile => tile.visible && tile.submitted && (tile.correct || (tile.award ?? 0) > 0))) return 'celebrate';
  return 'reveal';
}

export function Confetti() {
  return <span className="qs-confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>;
}
