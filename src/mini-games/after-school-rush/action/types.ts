import type { ArtName } from '../art';
import type { Local } from '../originals/model';
export type Family = 'run' | 'hurdles' | 'climb' | 'catch' | 'collect' | 'dodge' | 'aim' | 'timing'
  | 'balance' | 'push' | 'flap' | 'duel' | 'throw' | 'rhythm' | 'chase' | 'brake' | 'sweep' | 'carry';
export type ActionControl = { kind: 'stick'; x: number; y: number } | { kind: 'button'; button: 'a' | 'b' };
export type ActionSpec = {
  family: Family; variant: number; goal: number; boss: boolean; seconds: number;
  a: Local; b: Local; stick: Local; axis: 'free' | 'horizontal' | 'none' | 'aim';
  item: ArtName; hazard: ArtName;
};
export type Point = { x: number; y: number };
export type Platform = { x: number; y: number; w: number };
export type Hazard = Point & { radius: number; high?: boolean; width?: number; height?: number };
export type World = { platforms: Platform[]; hazards: Hazard[]; targets: Point[]; goal: Point; enemy?: Point; gateGap?: number };
