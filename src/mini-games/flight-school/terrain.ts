import type { Airport, Point } from './courses';

export const TILE = 52;
export const GRID = 30;
export const SEA_LEVEL = -3;
export const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
const smooth = (n: number) => {
  const t = clamp(n, 0, 1);
  return t * t * (3 - 2 * t);
};

function vertexHeight(airport: Airport, x: number, z: number) {
  const ax = Math.abs(x),
    az = Math.abs(z);
  const distance = Math.hypot(x * 0.95, z * 0.8);
  const wave = Math.sin(x * 0.007 + airport.bend) * Math.cos(z * 0.006);
  const hills = 0.55 + wave * 0.28 + Math.sin((x + z) * 0.009) * 0.17;
  switch (airport.region) {
    case 'island':
    case 'port':
    case 'bay':
    case 'reef': {
      const width = airport.region === 'bay' ? 365 : airport.region === 'reef' ? 235 : 275;
      // A flat central airfield, gently sloped seawalls, and a distant mainland.
      const coast = Math.max(
        ax - width - (airport.region === 'reef' ? 32 * Math.sin(z * 0.008) : 0),
        az - 525,
      );
      const island = clamp(-coast * 0.21, -25, 0);
      const mainland = clamp((x - 845) * 0.14, -60, 57) * (1 + 0.22 * Math.sin(z * 0.01));
      return Math.max(island, mainland);
    }
    case 'coast':
      return x > 240
        ? Math.max(-23, (295 + 34 * Math.sin(z * 0.007) - x) * 0.13)
        : smooth((-x - 350) / 600) * hills * 110;
    case 'alps':
      return smooth((distance - 385) / 560) * hills * 355;
    case 'volcano':
      return smooth((distance - 380) / 650) * hills * 210;
    default:
      return smooth((distance - 395) / 620) * hills * 100;
  }
}

/** The renderer uses these same diagonal triangles, including the shoreline. */
export function groundHeight(airport: Airport, x: number, z: number) {
  const left = Math.floor(x / TILE) * TILE,
    near = Math.floor(z / TILE) * TILE;
  const u = (x - left) / TILE,
    v = (z - near) / TILE;
  const a = vertexHeight(airport, left, near),
    b = vertexHeight(airport, left + TILE, near);
  const c = vertexHeight(airport, left, near + TILE),
    d = vertexHeight(airport, left + TILE, near + TILE);
  return u + v <= 1 ? a + u * (b - a) + v * (c - a) : d + (1 - u) * (c - d) + (1 - v) * (b - d);
}

export interface Building extends Point {
  w: number;
  d: number;
  h: number;
  kind: 'terminal' | 'hangar' | 'tower';
}
export const BUILDINGS: readonly Building[] = [
  { x: 134, z: -23, w: 52, d: 128, h: 12, kind: 'terminal' },
  { x: 117, z: -108, w: 12, d: 13, h: 32, kind: 'tower' },
  { x: 117, z: 103, w: 39, d: 48, h: 15, kind: 'hangar' },
  { x: 126, z: 168, w: 42, d: 43, h: 13, kind: 'hangar' },
];

export function hitsBuilding(x: number, y: number, z: number) {
  return BUILDINGS.some(
    (b) => Math.abs(x - b.x) < b.w / 2 + 1 && Math.abs(z - b.z) < b.d / 2 + 1 && y < b.h + 1,
  );
}
