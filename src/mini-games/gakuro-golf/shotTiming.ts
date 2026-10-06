/** The power tap does not reset time: travel to the far edge, then return. */
export const SWEEP_MS = 1100;
export const IMPACT_CENTER = .12;
export function meterPosition(elapsed: number) {
  const travel = Math.max(0, elapsed) / SWEEP_MS;
  return { position: Math.max(0, travel <= 1 ? travel : 2 - travel), returning: travel >= 1, expired: travel >= 2 };
}
export const impactAt = (position: number) => Math.max(-1, Math.min(1, (position - IMPACT_CENTER) / .08));
