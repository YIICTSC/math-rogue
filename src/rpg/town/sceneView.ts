/** Facing is a temporary presentation value; conversation never writes map preferences. */
export function residentFacing(
  player: { x: number; y: number },
  resident: { x: number; y: number },
) {
  const dx = resident.x - player.x,
    dy = resident.y - player.y;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
}
