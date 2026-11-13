import type { CastId, Pose } from './direction';
import type { Family } from './action/types';

export const usesDashMovement = (family: Family) => ['run', 'climb', 'hurdles', 'collect', 'dodge', 'flap', 'soccer', 'mining', 'grapple', 'kart'].includes(family);

export type ActorSpriteOptions = {
  id: CastId;
  pose: Pose;
  age: number;
  facing?: 'side' | 'rear' | 'front';
  dashMovement?: boolean;
  jumpVelocity?: number;
  actionRemaining?: number;
};
const ACTION_ROW: Record<Exclude<Pose, 'jump' | 'duck'>, number> = {
  idle: 0, walk: 0, strike: 2, throw: 3, swing: 4, read: 5, use: 6, aim: 7, win: 6, miss: 0,
};
const frame = (age: number, ms: number) => Math.floor(Math.max(0, age) / ms) % 4;

/** Dash sheets supply real running, airborne and sliding poses; never fake them
 * with a Dungeons standing frame. Jump frames follow the simulated flight. */
export function rushActorSprite({ id, pose, age, facing = 'side', dashMovement = false, jumpVelocity, actionRemaining }: ActorSpriteOptions) {
  const jumping = pose === 'jump', sliding = pose === 'duck', walking = pose === 'walk';
  const rearRun = facing === 'rear' && walking;
  if (jumping || sliding || rearRun || dashMovement && (walking || pose === 'idle')) {
    const rear = facing === 'rear';
    const folder = rear ? jumping || sliding ? 'rush/actions' : 'rush/rear' : sliding ? 'slides' : 'heroes';
    const rows = folder === 'slides' || folder === 'rush/rear' ? 1 : 2;
    const sideSlide = folder === 'slides';
    const column = sideSlide ? Math.floor(Math.max(0, age) / 90) % 2 : jumping
      ? jumpVelocity === undefined ? Math.min(3, Math.floor(Math.max(0, age) / 75))
        : jumpVelocity < -80 ? 0 : jumpVelocity <= 80 ? 1 : jumpVelocity < 400 ? 2 : 3
      : sliding ? age < 55 ? 0 : actionRemaining !== undefined && actionRemaining < 55 ? 3 : 1 + Math.floor(age / 70) % 2
        : walking ? frame(age, 85) : 0;
    return { path: `sprites/go-home-dash/${folder}/${id}.webp`, columns: sideSlide ? 2 : 4, rows,
      row: rear ? sliding ? 1 : 0 : jumping ? 1 : 0, column,
      aspect: sideSlide ? 160 / 80 : 128 / 160, heightScale: sideSlide ? .6 : 1, atlas: 'dash' as const };
  }
  return { path: `sprites/dungeons1/actions/${id}.webp`, columns: 8, rows: 8,
    row: walking ? Math.floor(Math.max(0, age) / 85) % 2 : ACTION_ROW[pose as keyof typeof ACTION_ROW],
    column: facing === 'rear' ? 1 : facing === 'front' || pose === 'win' || pose === 'miss' ? 0 : 2,
    aspect: 1, heightScale: 1, atlas: 'dungeon' as const };
}
