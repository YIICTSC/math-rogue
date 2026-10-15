/** The power tap does not reset time: travel to the far edge, then return. */
export const SWEEP_MS = 1100;
export const MAX_HOLD_MS = 220;
export const MAX_SNAP = .97;
export const powerAt = (position: number) => position >= MAX_SNAP ? 1 : Math.max(.05, position);
export const IMPACT_CENTER = .12;
export function meterPosition(elapsed: number) {
  const time = Math.max(0, elapsed);
  const returning = time >= SWEEP_MS + MAX_HOLD_MS;
  const position = returning ? 1 - (time - SWEEP_MS - MAX_HOLD_MS) / SWEEP_MS : Math.min(1, time / SWEEP_MS);
  return { position: Math.max(0, position), returning, expired: time >= SWEEP_MS * 2 + MAX_HOLD_MS };
}
export const impactAt = (position: number) => Math.max(-1, Math.min(1, (position - IMPACT_CENTER) / .1));
