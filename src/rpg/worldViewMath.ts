/** Camera-relative controls mapped onto the existing authoritative grid. */
export function relativeMove(dx: number, dy: number, facing: number) {
  const n = ((facing % 4) + 4) % 4;
  return n === 0
    ? { dx, dy }
    : n === 1
      ? { dx: -dy, dy: dx }
      : n === 2
        ? { dx: -dx, dy: -dy }
        : { dx: dy, dy: -dx };
}
export const compassAngle = (facing: number) =>
  ((((facing % 4) + 4) % 4) * Math.PI) / 2;
export function shortestTurn(from: number, to: number) {
  return (
    ((((to - from + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) -
    Math.PI
  );
}
