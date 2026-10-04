export interface SwipePoint {
  x: number;
  y: number;
}
export function bowlingSwipe(points: SwipePoint[], milliseconds: number) {
  if (points.length < 2 || !Number.isFinite(milliseconds) || milliseconds < 20)
    return;
  const a = points[0],
    b = points.at(-1)!,
    dx = b.x - a.x,
    dy = a.y - b.y;
  if (![a.x, a.y, b.x, b.y].every(Number.isFinite) || dy < 0.08) return;
  const middle = points[Math.floor(points.length / 2)],
    curve = middle.x - (a.x + b.x) / 2,
    clamp = (n: number, min = -1, max = 1) => Math.max(min, Math.min(max, n));
  return {
    aim: clamp((a.x - 0.5) * 1.6 + dx * 0.6),
    power: clamp(dy * 1.3 + (dy / Math.max(80, milliseconds)) * 220, 0.2, 1),
    spin: clamp(curve * 10 + dx * 0.4),
  };
}
