export interface Point { x: number; z: number }
export interface Hazard extends Point { rx: number; rz: number }
export interface Hole { par: number; cup: Point; fairway: number; wind: Point; water: Hazard[]; sand: Hazard[] }
export const HOLES: Hole[] = [
  { par: 3, cup: { x: 0, z: 135 }, fairway: 23, wind: { x: .25, z: .1 }, water: [{ x: -32, z: 65, rx: 16, rz: 22 }], sand: [{ x: 15, z: 119, rx: 9, rz: 12 }] },
  { par: 4, cup: { x: 24, z: 235 }, fairway: 25, wind: { x: -.4, z: .2 }, water: [{ x: -18, z: 135, rx: 21, rz: 32 }], sand: [{ x: 41, z: 214, rx: 12, rz: 16 }, { x: -5, z: 65, rx: 10, rz: 14 }] },
  { par: 5, cup: { x: -20, z: 320 }, fairway: 27, wind: { x: .55, z: -.2 }, water: [{ x: 21, z: 198, rx: 22, rz: 35 }], sand: [{ x: -38, z: 295, rx: 12, rz: 15 }, { x: -25, z: 110, rx: 12, rz: 20 }] },
  { par: 4, cup: { x: -12, z: 220 }, fairway: 24, wind: { x: -0.18, z: 0.22 }, water: [{ x: -32, z: 110, rx: 15, rz: 26 }], sand: [{ x: 5, z: 200, rx: 10, rz: 12 }] },
  { par: 3, cup: { x: 18, z: 115 }, fairway: 22, wind: { x: 0.32, z: -0.12 }, water: [{ x: 36, z: 70, rx: 13, rz: 20 }], sand: [{ x: -2, z: 102, rx: 8, rz: 11 }] },
  { par: 4, cup: { x: -30, z: 245 }, fairway: 22, wind: { x: -0.3, z: 0.25 }, water: [{ x: 26, z: 155, rx: 19, rz: 30 }], sand: [{ x: -46, z: 222, rx: 10, rz: 12 }] },
  { par: 5, cup: { x: 28, z: 305 }, fairway: 27, wind: { x: 0.42, z: 0.18 }, water: [{ x: -26, z: 180, rx: 20, rz: 34 }], sand: [{ x: 43, z: 278, rx: 11, rz: 14 }, { x: 12, z: 95, rx: 9, rz: 14 }] },
  { par: 3, cup: { x: -16, z: 145 }, fairway: 21, wind: { x: -0.22, z: -0.16 }, water: [{ x: 25, z: 88, rx: 16, rz: 22 }], sand: [{ x: -34, z: 128, rx: 9, rz: 12 }] },
  { par: 5, cup: { x: 12, z: 330 }, fairway: 26, wind: { x: 0.5, z: 0.16 }, water: [{ x: -35, z: 210, rx: 18, rz: 30 }], sand: [{ x: 29, z: 305, rx: 12, rz: 15 }, { x: -9, z: 130, rx: 10, rz: 16 }] },
  { par: 4, cup: { x: 32, z: 230 }, fairway: 23, wind: { x: 0.28, z: -0.28 }, water: [{ x: -22, z: 126, rx: 19, rz: 24 }], sand: [{ x: 47, z: 208, rx: 10, rz: 14 }] },
  { par: 4, cup: { x: -25, z: 255 }, fairway: 24, wind: { x: -0.46, z: 0.12 }, water: [{ x: 29, z: 146, rx: 18, rz: 29 }], sand: [{ x: -42, z: 231, rx: 11, rz: 15 }] },
  { par: 3, cup: { x: 8, z: 125 }, fairway: 20, wind: { x: 0.16, z: 0.3 }, water: [{ x: -30, z: 76, rx: 17, rz: 20 }], sand: [{ x: 27, z: 111, rx: 8, rz: 10 }] },
  { par: 5, cup: { x: -28, z: 340 }, fairway: 27, wind: { x: -0.55, z: -0.18 }, water: [{ x: 28, z: 218, rx: 20, rz: 34 }], sand: [{ x: -45, z: 315, rx: 11, rz: 14 }, { x: 5, z: 100, rx: 9, rz: 13 }] },
  { par: 4, cup: { x: 15, z: 210 }, fairway: 22, wind: { x: 0.4, z: 0.2 }, water: [{ x: -32, z: 120, rx: 17, rz: 25 }], sand: [{ x: 32, z: 190, rx: 9, rz: 13 }] },
  { par: 4, cup: { x: -8, z: 270 }, fairway: 25, wind: { x: -0.25, z: -0.22 }, water: [{ x: 32, z: 163, rx: 18, rz: 29 }], sand: [{ x: -27, z: 246, rx: 10, rz: 14 }, { x: 14, z: 80, rx: 9, rz: 12 }] },
  { par: 3, cup: { x: -20, z: 155 }, fairway: 22, wind: { x: -0.38, z: 0.14 }, water: [{ x: 27, z: 85, rx: 16, rz: 24 }], sand: [{ x: -38, z: 139, rx: 9, rz: 11 }] },
  { par: 4, cup: { x: 28, z: 250 }, fairway: 23, wind: { x: 0.48, z: -0.2 }, water: [{ x: -24, z: 155, rx: 21, rz: 26 }], sand: [{ x: 46, z: 228, rx: 10, rz: 14 }] },
  { par: 5, cup: { x: 0, z: 355 }, fairway: 28, wind: { x: 0.3, z: 0.32 }, water: [{ x: -34, z: 230, rx: 18, rz: 34 }, { x: 37, z: 115, rx: 15, rz: 25 }], sand: [{ x: 19, z: 328, rx: 11, rz: 15 }, { x: -21, z: 195, rx: 10, rz: 15 }] },
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
