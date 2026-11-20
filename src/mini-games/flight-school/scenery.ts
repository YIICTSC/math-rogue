import type { Flight } from './simulation';
import { surfaceHeight } from './routes';
import { groundHeight, SEA_LEVEL } from './terrain';

/** Check nearby rendered terrain, rather than the destination airport or sea material. */
export function seaNearby(s: Flight): boolean {
  const route = s.lesson.route;
  if (route) {
    const { cols, rows, width, height, grid } = route.region;
    const dx = width / (cols - 1),
      dz = height / (rows - 1);
    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const i = row * cols + col;
        // A sea-level area, not an isolated low sample or a flattened runway.
        if ([i, i + 1, i + cols, i + cols + 1].some((n) => grid[n] !== 0)) continue;
        const x = (col + 0.5) * dx - width / 2;
        const z = (row + 0.5) * dz - height / 2;
        if (Math.hypot(x - s.x, z - s.z) > 5000) continue;
        if (clearView(s, x, z, 0, (a, b) => surfaceHeight(route, a, b))) return true;
      }
    }
    return false;
  }
  const terrain = (x: number, z: number) => groundHeight(s.lesson.airport, x, z);
  for (let x = -1400; x <= 1400; x += 100) {
    for (let z = -1400; z <= 1400; z += 100) {
      if (Math.hypot(x - s.x, z - s.z) > 1800 || terrain(x, z) >= SEA_LEVEL) continue;
      if (clearView(s, x, z, SEA_LEVEL, terrain)) return true;
    }
  }
  return false;
}

function clearView(
  s: Flight,
  x: number,
  z: number,
  sea: number,
  terrain: (x: number, z: number) => number,
): boolean {
  for (let i = 1; i < 20; i++) {
    const t = i / 20;
    if (terrain(s.x + (x - s.x) * t, s.z + (z - s.z) * t) > s.y + (sea - s.y) * t) return false;
  }
  return true;
}
