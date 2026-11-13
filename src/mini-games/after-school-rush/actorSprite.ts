import type { CastId, Pose } from './direction';
import type { Family } from './action/types';
import { DASH_HERO_ART } from '../go-home-dash/heroes';
import metrics from './battleSpriteMetrics.json';

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
export type BattleAction = 'attack' | 'skill' | 'hit';
export const battleSpritePath = (id: CastId, action: BattleAction) =>
  DASH_HERO_ART[id].replace('/characters/', `/characters-${action}-sheets/`);
export const battleSpritePaths = (id: CastId) => (['attack', 'skill', 'hit'] as const).map(action => battleSpritePath(id, action));
const frame = (age: number, ms: number) => Math.floor(Math.max(0, age) / ms) % 4;

/** Dash sheets supply real running, airborne and sliding poses; never fake them
 * with a Dungeons standing frame. Jump frames follow the simulated flight. */
export function rushActorSprite({ id, pose, age, facing = 'side', jumpVelocity, actionRemaining }: ActorSpriteOptions) {
  const jumping = pose === 'jump', sliding = pose === 'duck', walking = pose === 'walk';
  const rearRun = facing === 'rear' && walking;
  if (jumping || sliding || rearRun || walking || pose === 'idle') {
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
  const action: BattleAction = pose === 'miss' ? 'hit' : ['use', 'read', 'win'].includes(pose) ? 'skill' : 'attack';
  const cell = Math.min(3, Math.floor(Math.max(0, age) / 95));
  const anchor = metrics[id][action];
  return { path: battleSpritePath(id, action), columns: 2, rows: 2,
    row: Math.floor(cell / 2), column: cell % 2, aspect: 1, heightScale: anchor.scale,
    feet: anchor.feet[cell], shift: anchor.shift[cell], atlas: 'battle' as const };
}
