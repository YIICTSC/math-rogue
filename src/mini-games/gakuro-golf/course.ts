export interface Point { x: number; z: number }
export interface Hazard extends Point { rx: number; rz: number }
export interface Hole { par: number; cup: Point; fairway: number; wind: Point; water: Hazard[]; sand: Hazard[] }
export const HOLES: Hole[] = [
  { par: 3, cup: { x: 0, z: 135 }, fairway: 23, wind: { x: .25, z: .1 }, water: [{ x: -32, z: 65, rx: 16, rz: 22 }], sand: [{ x: 15, z: 119, rx: 9, rz: 12 }] },
  { par: 4, cup: { x: 24, z: 235 }, fairway: 25, wind: { x: -.4, z: .2 }, water: [{ x: -18, z: 135, rx: 21, rz: 32 }], sand: [{ x: 41, z: 214, rx: 12, rz: 16 }, { x: -5, z: 65, rx: 10, rz: 14 }] },
  { par: 5, cup: { x: -20, z: 320 }, fairway: 27, wind: { x: .55, z: -.2 }, water: [{ x: 21, z: 198, rx: 22, rz: 35 }], sand: [{ x: -38, z: 295, rx: 12, rz: 15 }, { x: -25, z: 110, rx: 12, rz: 20 }] },
];
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
export const inHazard = (p: Point, h: Hazard) => ((p.x - h.x) / h.rx) ** 2 + ((p.z - h.z) / h.rz) ** 2 <= 1;
export function surface(hole: Hole, p: Point): 'water' | 'sand' | 'green' | 'fairway' | 'rough' | 'ob' {
  if (Math.abs(p.x) > 75 || p.z < -25 || p.z > hole.cup.z + 45) return 'ob';
  if (hole.water.some(h => inHazard(p, h))) return 'water';
  if (distance(p, hole.cup) < 17) return 'green';
  if (hole.sand.some(h => inHazard(p, h))) return 'sand';
  return Math.abs(p.x - hole.cup.x * Math.max(0, p.z) / hole.cup.z) < hole.fairway ? 'fairway' : 'rough';
}
