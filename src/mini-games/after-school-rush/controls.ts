import type { Entry } from './catalog';

export type Direction = 'left' | 'right' | 'up' | 'down';
export type RushControl = Direction | 'a' | 'b';
export type ControlProfile = {
  scheme: 'single' | 'dual' | 'select' | 'direction' | 'action';
  columns?: number;
  directions?: Partial<Record<Direction, number>>;
  a?: number | null;
  b?: number | null;
  repeat?: boolean;
};
export const DIRECTION_SYMBOLS: Record<Direction, string> = { left: '←', right: '→', up: '↑', down: '↓' };
export function controlsFor(entry: Entry): ControlProfile {
  if (entry.game.action) return { scheme: 'action', a: 4, b: 5, directions: { left: 0, right: 1, up: 2, down: 3 } };
  const count = entry.game.mechanic.display(entry.game.mechanic.initial, { now: 0, before: 0, dt: 0 }).buttons.length;
  return count === 1 ? { scheme: 'single' } : count === 2 ? { scheme: 'dual' } : { scheme: 'select', columns: count >= 6 ? 3 : count };
}
export function stickDirection(x: number, y: number): Direction | undefined {
  if (Math.hypot(x, y) < .3) return;
  return Math.abs(x) > Math.abs(y) ? x < 0 ? 'left' : 'right' : y < 0 ? 'up' : 'down';
}
export function cursorNeighbor(cursor: number, count: number, columns: number, direction: Direction) {
  const current = Math.max(0, Math.min(count - 1, cursor));
  if (direction === 'left') return (current + count - 1) % count;
  if (direction === 'right') return (current + 1) % count;
  // Scan the same column first; a short final row wraps to its nearest valid cell.
  const rows = Math.ceil(count / columns), row = Math.floor(current / columns), col = current % columns;
  const nextRow = (row + (direction === 'up' ? rows - 1 : 1)) % rows;
  return Math.min(count - 1, nextRow * columns + col);
}
export function resolveControl(profile: ControlProfile, cursor: number, count: number, command: RushControl):
  { index: number } | { cursor: number } | { undo: true } | undefined {
  if (profile.scheme === 'select') {
    if (command === 'a') return { index: Math.max(0, Math.min(count - 1, cursor)) };
    if (command === 'b') return { undo: true };
    return { cursor: cursorNeighbor(cursor, count, profile.columns ?? count, command) };
  }
  if (profile.scheme === 'direction' || profile.scheme === 'action') {
    const index = command === 'a' ? profile.a ?? cursor : command === 'b' ? profile.b : profile.directions?.[command];
    return index === undefined || index === null ? undefined : { index };
  }
  if (command === 'a') return { index: 0 };
  if (command === 'b' && profile.scheme === 'dual') return { index: 1 };
}
export const repeatsDirection = (profile: ControlProfile) => profile.scheme === 'select' || !!profile.repeat;
