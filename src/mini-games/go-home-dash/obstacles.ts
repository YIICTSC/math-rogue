export interface SolidRect { left: number; top: number; width: number; height: number }
export interface StairShape { type: string; x: number; width: number; height: number }
export const isStair = (type: string) => ['STEPS', 'HIGH_STEPS', 'MOUNTAIN_STEPS'].includes(type);
// One geometry source for visible steps, landing surfaces and solid side walls.
export function stairRects(obstacle: StairShape, floor: number): SolidRect[] {
  const count = obstacle.type === 'STEPS' ? 3 : obstacle.type === 'HIGH_STEPS' ? 5 : 7;
  return Array.from({length: count}, (_, i) => ({
    left: obstacle.x - obstacle.width / 2 + i * obstacle.width / count,
    top: floor - obstacle.height * (i + 1) / count,
    width: obstacle.width / count,
    height: obstacle.height * (i + 1) / count,
  }));
}
export const FLIGHT_GAP = 182;
export function flightGateRects(x: number, width: number, center: number, gap = FLIGHT_GAP): SolidRect[] {
  const top = center - gap / 2, bottom = center + gap / 2;
  return [{left:x-width/2,top:0,width,height:top}, {left:x-width/2,top:bottom,width,height:340-bottom}];
}
/** Seeded dimensions: a readable continuous course, with room to react between pillars. */
export function flightGateShape(seed: number, distance: number) {
  const index = Math.floor(distance / 420);
  const phase = index * 1.37 + (seed % 97);
  return {width: [56, 88, 120, 148][((index + seed) % 4 + 4) % 4],
    baseGap: [176, 202, 160, 188, 212][((index + seed) % 5 + 5) % 5],
    baseY: 174 + Math.sin(phase) * 27, phase};
}
export const overlapsSolid = (x: number, y: number, rect: SolidRect) =>
  x + 15 > rect.left && x - 15 < rect.left + rect.width && y - 8 > rect.top && y - 64 < rect.top + rect.height;
